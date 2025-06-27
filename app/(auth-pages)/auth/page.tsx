
import { Suspense } from 'react';
import AuthForm from './auth-form';


function Loading() {
  return <div>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm />
    </Suspense>
  );
}
