import MessageSlipForm from '@/components/message-slip-form';

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl">
        <MessageSlipForm />
      </div>
    </main>
  );
}
