import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { ALL_AUTHORS, UPDATE_AUTHOR } from '../queries';
import Select from 'react-select';

const Authors = ({ show, authors }) => {
  const [name, setName] = useState(null);
  const [born, setBorn] = useState('');
  const [updateAuthor] = useMutation(UPDATE_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  if (!show) {
    return null;
  }

  if (!authors) {
    return <div>loading...</div>;
  }

  const submit = async (event) => {
    event.preventDefault();

    updateAuthor({ variables: { name, born } });

    setName('');
    setBorn('');
  };

  const handleChange = (n) => {
    setName(n.value);
  };

  const options = authors.map((a) => ({
    value: a.name,
    label: a.name,
  }));

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.books.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Set birthyear</h3>
      <form onSubmit={submit}>
        <div>
          name
          <Select value={name} onChange={handleChange} options={options} />
        </div>
        <div>
          born
          <input
            type='number'
            value={born}
            onChange={({ target }) => setBorn(Number(target.value))}
          />
        </div>
        <button type='submit'>update author</button>
      </form>
    </div>
  );
};

export default Authors;
