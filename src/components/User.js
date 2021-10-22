import {useQuery} from 'utils/react-query-lite';

function useUser(id) {
  return useQuery({
    queryKey: ['USERS', id],
    queryFn: async function () {
      const response = await fetch(`https://reqres.in/api/users/${id}`);
      const json = await response.json();
      return json;
    },
    staleTime: 5000
  });
}

export default function User({userId, onClickBack}) {
  const query = useUser(userId);
  if (query.status === 'loading') {
    return <div>Cargando</div>;
  }

  if (query.status === 'error') {
    return <div>Un error sucedió</div>;
  }

  return (
    <div>
      <h1>{query.data.data.email}</h1>
      <button onClick={onClickBack}>Volver</button>
    </div>
  );
}
