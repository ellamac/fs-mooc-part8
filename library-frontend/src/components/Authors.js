import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { ALL_AUTHORS, UPDATE_AUTHOR } from '../queries';
import Select from 'react-select';

const Authors = (props) => {
  const [name, setName] = useState(null);
  const [born, setBorn] = useState('');
  const authors = useQuery(ALL_AUTHORS);
  const [updateAuthor] = useMutation(UPDATE_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  if (!props.show) {
    return null;
  }

  if (authors.loading || !authors.data) {
    return <div>loading...</div>;
  }

  const options = authors.data.allAuthors.map((a) => ({
    value: a.name,
    label: a.name,
  }));

  const submit = async (event) => {
    event.preventDefault();

    updateAuthor({ variables: { name, born } });

    setName('');
    setBorn('');
  };

  const handleChange = (name) => {
    setName(name.value);
  };

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
          {authors.data.allAuthors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
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
