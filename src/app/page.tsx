import { ChatRoom } from "@/components/ChatRoom";

export default function Home() {
  return (
    <main
      className="h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="h-full">
        <ChatRoom />
      </div>
    </main>
  );
}
