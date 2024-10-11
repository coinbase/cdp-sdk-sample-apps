import ChatInterface from '@/components/ui/ChatInterface';

export default function Instamint() {
  return (
    <div className="flex flex-col items-center min-h-screen p-4 w-full">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">Instamint</h1>

      <ChatInterface />

    </div>
  );
}
