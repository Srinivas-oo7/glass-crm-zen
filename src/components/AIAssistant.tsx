import { useState } from "react";
import { MessageCircle, Mic, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAssistant = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant. I can help you navigate your CRM. Try saying 'Expand Contacts tile' or 'Show deals closing this week'."
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user" as const, content: input },
      { role: "assistant" as const, content: `I understand you want to: "${input}". This feature will be connected to Gemini AI soon!` }
    ];

    setMessages(newMessages);
    setInput("");
  };

  return (
    <>
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-all z-50 flex items-center justify-center group"
          style={{
            boxShadow: "0 0 40px rgba(0, 122, 255, 0.4)",
          }}
        >
          <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
        </button>
      ) : (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] glass-tile gradient-ai z-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between p-4 border-b border-white/30">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/60 border border-white/40"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/30">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full hover:bg-primary/10"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your command..."
                className="bg-white/60 border-white/40 rounded-xl"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="shrink-0 rounded-full bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
