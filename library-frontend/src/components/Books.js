import React from 'react';

const Books = ({ books, show, showBooks }) => {
  if (!show) {
    return null;
  }

  return (
    <div>
      <h2>books</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={() => showBooks('genre1')}>genre1</button>
        <button onClick={() => showBooks('genre2')}>genre2</button>
        <button onClick={() => showBooks('1234')}>1234</button>
        <button onClick={() => showBooks()}>all genres</button>
      </div>
    </div>
  );
};

export default Books;
