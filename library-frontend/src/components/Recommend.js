import React from 'react';

const Recommend = ({ show, books, genre }) => {
  if (!show) {
    return null;
  }

  return genre ? (
    <div>
      <h2>Recommendations</h2>
      <div>
        books in your favorite genre <b>{genre}</b>
      </div>
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
    </div>
  ) : (
    <div>
      <h2>Recommendations</h2>
      <div> You don't have a favortie genre </div>
    </div>
  );
};

export default Recommend;
