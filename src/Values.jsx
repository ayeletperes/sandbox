import { useForm } from '@open-tech-world/react-form';

export default function Values() {
  const { values } = useForm();
  return (
    <div
      style={{
        backgroundColor: '#001f3f',
        color: 'white',
        padding: '15px',
        marginTop: '15px'
      }}
    >
      <pre>{JSON.stringify(values, null, 4)}</pre>
    </div>
  );
}
