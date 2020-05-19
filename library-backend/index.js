const { ApolloServer, gql, UserInputError } = require('apollo-server');
const Book = require('./models/book');
const Author = require('./models/author');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

const MONGODB_URI =
  'mongodb+srv://ellamac:salasana@cluster0-lgi3u.mongodb.net/test?retryWrites=true&w=majority';

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
    bookCount: Int!
    id: ID!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
  }

  type Query {
    bookCount: Int!
    allBooks(genre: String): [Book!]!
    authorCount: Int!
    allAuthors: [Author!]!
  }
`;

const resolvers = {
  Query: {
    bookCount: () => Book.collection.count(),
    allBooks: (root, args) => {
      return args.genre
        ? Book.find({ genres: { $in: [args.genre] } })
        : Book.find({});
    },
    authorCount: () => Author.collection.count(),
    allAuthors: () => Author.find({}),
  },
  Author: {
    bookCount: async (author) => {
      const books = await Book.find({ author: author._id });
      return books.length;
    },
  },
  Book: {
    author: async (root) => {
      const author = await Author.findOne({ _id: root.author });
      return {
        name: author.name,
        born: author.born,
        bookCount: author.bookCount,
      };
    },
  },

  Mutation: {
    addBook: async (root, args) => {
      console.log('title', args.title.length);
      if (args.title.length < 2) {
        throw new UserInputError('Title must be at least 2 digits.', {
          invalidArgs: args.title,
        });
      }
      if (args.author.length < 4) {
        throw new UserInputError('Author must be at least 4 digits.', {
          invalidArgs: args.author,
        });
      }
      if (await Book.findOne({ title: args.title })) {
        throw new UserInputError('Title must be unique', {
          invalidArgs: args.title,
        });
      }
      let author = await Author.findOne({ name: args.author });
      if (!author) {
        author = new Author({ name: args.author });
        author.save();
      }
      const book = new Book({ ...args, author: author });
      return book.save();
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name });
      if (!author) {
        return null;
      }
      author.born = args.setBornTo;
      return author.save();
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
