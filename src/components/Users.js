import {useQuery} from 'utils/react-query-lite';

export default function Users({onClickUser}) {
  const query = useQuery({
    queryKey: 'users',
    queryFn: async function () {
      const response = await fetch(`https://reqres.in/api/users`);
      return await response.json();
    },
    staleTime: 3000
  });

  if (query.status === 'loading') {
    return <div>Cargando...</div>;
  }

  if (query.status === 'error') {
    return <div>Error: {query.error}</div>;
  }

  return (
    <div>
      <h1>Usuarios</h1>
      <ul>
        {query.data.data.map((user) => (
          <li key={`user--${user.id}`} onClick={() => onClickUser(user.id)}>
            {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
