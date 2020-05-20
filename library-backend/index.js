const {
  ApolloServer,
  gql,
  UserInputError,
  AuthenticationError,
} = require('apollo-server');
const Book = require('./models/book');
const Author = require('./models/author');
const User = require('./models/user');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

const MONGODB_URI =
  'mongodb+srv://ellamac:<password>@cluster0-lgi3u.mongodb.net/test?retryWrites=true&w=majority';

console.log('connecting to', MONGODB_URI);

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message);
  });

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Book {
    title: String!
    author: Author!
    published: Int!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    id: ID!
    books: [Book!]
  }

  type Query {
    bookCount: Int!
    allBooks(genre: String): [Book!]!
    authorCount: Int!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }

  type Subscription {
    bookAdded: Book!
    authorAdded: Author!
  }
`;

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY';

const { PubSub } = require('apollo-server');
const pubsub = new PubSub();

const resolvers = {
  Query: {
    bookCount: () => Book.collection.count(),
    allBooks: async (root, args) => {
      return args.genre
        ? Book.find({ genres: { $in: [args.genre] } })
        : Book.find({});
    },
    authorCount: () => Author.collection.count(),
    allAuthors: async () => await Author.find({}).populate('books'),
    me: (root, args, context) => {
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError('not authenticated');
      }
      return {
        username: currentUser.username,
        favoriteGenre: currentUser.favoriteGenre
          ? currentUser.favoriteGenre
          : '',
      };
    },
  },
  Book: {
    author: async (root) => {
      const author = await Author.findOne({ _id: root.author });
      if (!author) {
        return null;
      }
      return {
        born: author.born,
        name: author.name,
        bookCount: author.bookCount,
      };
    },
  },

  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError('not authenticated');
      }
      const author = await Author.findOne({ name: args.author });
      try {
        if (!author) {
          const a = new Author({ name: args.author });
          const book = new Book({ ...args, author: a._id });
          a.books = [book._id];
          await a.save();
          await book.save();
          pubsub.publish('BOOK_ADDED', { bookAdded: book });
          return book;
        }
        const book = new Book({ ...args, author: author._id });
        await book.save();
        pubsub.publish('BOOK_ADDED', { bookAdded: book });
        author.books = author.books.concat(book._id);
        await author.save();
        return book;
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError('not authenticated');
      }
      const author = await Author.findOne({ name: args.name });
      if (!author) {
        return null;
      }
      author.born = args.setBornTo;
      return author.save();
    },
    createUser: (root, args) => {
      const user = new User({ username: args.username });

      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== 'secret') {
        throw new UserInputError('wrong credentials');
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED']),
    },
    authorAdded: {
      subscribe: () => pubsub.asyncIterator(['AUTHOR_ADDED']),
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscriptions ready at ${subscriptionsUrl}`);
});
