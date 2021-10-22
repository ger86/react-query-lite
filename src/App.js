import {useState} from 'react';
import Users from 'components/Users';
import User from 'components/User';
import {QueryClientProvider, QueryClient} from 'utils/react-query-lite';

const queryClient = new QueryClient();

function App() {
  const [userId, setUserId] = useState(null);
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        {userId === null && <Users onClickUser={(id) => setUserId(id)} />}
        {userId !== null && <User onClickBack={(id) => setUserId(null)} userId={userId} />}
      </div>
    </QueryClientProvider>
  );
}

export default App;
