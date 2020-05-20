import React, { useState, useEffect } from 'react';
import { useApolloClient, useLazyQuery, useSubscription } from '@apollo/client';
import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';
import Login from './components/Login';
import Recommend from './components/Recommend';
import { ALL_BOOKS, BOOK_ADDED, USER } from './queries';
import Notify from './components/Notify';

const App = () => {
  const [token, setToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [page, setPage] = useState('authors');
  const [getBooks, { loading, data }] = useLazyQuery(ALL_BOOKS);
  const client = useApolloClient();
  const [getUser, user] = useLazyQuery(USER);

  useEffect(() => {
    console.log('USERRR', user);
    user.data
      ? console.log('userme', user.data.me.favoriteGenre)
      : console.log('Not yet');
  }, [user]);
  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) =>
      set.map((p) => p.title).includes(object.title);

    const dataInStore = client.readQuery({ query: ALL_BOOKS });
    if (!includedIn(dataInStore.allBooks, addedBook)) {
      client.writeQuery({
        query: ALL_BOOKS,
        data: { allBooks: dataInStore.allBooks.concat(addedBook) },
      });
    }
  };

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const addedBook = subscriptionData.data.bookAdded;
      setErrorMessage(`${addedBook.title} added`);
      updateCacheWith(addedBook);
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('library-user-token');
    if (token) {
      setToken(token);
    }
    getBooks();
    getUser();
  }, []);

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };

  let timeoutId;
  const notify = (message) => {
    setErrorMessage(message);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  const showBooks = (genre) => {
    genre ? getBooks({ variables: { genre } }) : getBooks();
  };

  if (!token) {
    return (
      <div>
        <Notify errorMessage={errorMessage} />
        <h2>Login</h2>
        <Login setToken={setToken} setError={notify} />
      </div>
    );
  }

  if (loading || !data) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <Notify message={errorMessage} />
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
        <button onClick={() => setPage('recommend')}>recommend</button>
        <button onClick={() => logout()}>logout</button>
      </div>

      <Authors show={page === 'authors'} />

      <Books
        show={page === 'books'}
        books={data.allBooks}
        showBooks={showBooks}
      />

      <NewBook
        show={page === 'add'}
        setError={notify}
        updateCacheWith={updateCacheWith}
      />

      <Recommend
        show={page === 'recommend'}
        notify={notify}
        books={data.allBooks}
        genre={user.data ? user.data.me.favoriteGenre : ''}
      />
    </div>
  );
};

export default App;
