import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Send, MessageCircle, Loader2, CheckCheck, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ── Types ─────────────────────────────────────── */
interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  isMine: boolean;
  senderName: string;
  senderAvatar?: string;
  createdAt: string;
}

interface ThreadData {
  messages: Message[];
  bookingId: string;
  otherParty: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  } | null;
  cleanerUserId: string | null;
}

/* ── Helpers ────────────────────────────────────── */
async function fetchThread(bookingId: string): Promise<ThreadData> {
  const res = await fetch(`${import.meta.env.BASE_URL}api/bookings/${bookingId}/messages`, {
    headers: { "x-user-id": "user-demo-1" },
  });
  if (!res.ok) throw new Error("Failed to load messages");
  return res.json();
}

async function sendMessage(bookingId: string, content: string): Promise<Message> {
  const res = await fetch(`${import.meta.env.BASE_URL}api/bookings/${bookingId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": "user-demo-1" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - msgDay.getTime()) / 86400000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* Bubble component */
function Bubble({ msg }: { msg: Message }) {
  return (
    <div className={cn("flex items-end gap-2 max-w-[82%]", msg.isMine ? "ml-auto flex-row-reverse" : "mr-auto")}>
      {!msg.isMine && (
        <div className="w-7 h-7 rounded-full bg-muted overflow-hidden shrink-0 mb-1">
          {msg.senderAvatar ? (
            <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              {msg.senderName[0]}
            </div>
          )}
        </div>
      )}
      <div className={cn("flex flex-col gap-0.5", msg.isMine ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
            msg.isMine
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-card border border-border text-foreground rounded-bl-sm"
          )}
        >
          {msg.content}
        </div>
        <div className={cn("flex items-center gap-1 px-1", msg.isMine ? "flex-row-reverse" : "flex-row")}>
          <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
          {msg.isMine && (
            msg.isRead
              ? <CheckCheck size={11} className="text-primary" />
              : <Check size={11} className="text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────── */
export default function MessagesPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const queryKey = ["messages", bookingId];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchThread(bookingId!),
    enabled: !!bookingId,
    refetchInterval: 10000, /* poll every 10s */
  });

  /* Auto-scroll to bottom whenever messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  const mutation = useMutation({
    mutationFn: (content: string) => sendMessage(bookingId!, content),
    onMutate: async (content) => {
      setSending(true);
      /* Optimistic update */
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<ThreadData>(queryKey);
      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        bookingId: bookingId!,
        senderId: "user-demo-1",
        recipientId: "",
        content,
        isRead: false,
        isMine: true,
        senderName: "You",
        createdAt: new Date().toISOString(),
      };
      if (prev) {
        queryClient.setQueryData<ThreadData>(queryKey, {
          ...prev,
          messages: [...prev.messages, optimistic],
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
      toast({ title: "Couldn't send message", variant: "destructive" });
    },
    onSuccess: (msg) => {
      queryClient.setQueryData<ThreadData>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages.filter((m) => !m.id.startsWith("optimistic-")),
            msg,
          ],
        };
      });
    },
    onSettled: () => setSending(false),
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText("");
    mutation.mutate(trimmed);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* Group messages by date */
  const grouped: { label: string; messages: Message[] }[] = [];
  (data?.messages || []).forEach((msg) => {
    const label = formatDateLabel(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (!last || last.label !== label) {
      grouped.push({ label, messages: [msg] });
    } else {
      last.messages.push(msg);
    }
  });

  const other = data?.otherParty;
  const firstName = other?.fullName?.split(" ")[0] || "Cleaner";

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header — sticky */}
      <div className="bg-card border-b border-border px-4 pt-14 pb-3 shrink-0">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => setLocation(`/bookings/${bookingId}`)}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Other party avatar + name */}
          <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0">
            {other?.avatarUrl ? (
              <img src={other.avatarUrl} alt={other.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                {(other?.fullName || "?")[0]}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {other?.fullName || "Loading…"}
            </p>
            <p className="text-[10px] text-muted-foreground">Booking message thread</p>
          </div>

          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Polling live" />
        </div>
      </div>

      {/* Message thread — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto w-full">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <MessageCircle size={32} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Couldn't load messages</p>
          </div>
        )}

        {!isLoading && !error && grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-6">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
              <MessageCircle size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-1">
                Start a conversation with {firstName}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Messages are private to this booking. Most issues are resolved
                quickly through direct communication.
              </p>
            </div>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.label} className="mb-2">
            {/* Date divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground font-medium px-1">{group.label}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex flex-col gap-2">
              {group.messages.map((msg) => (
                <Bubble key={msg.id} msg={msg} />
              ))}
            </div>
          </div>
        ))}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input bar — fixed to bottom */}
      <div className="bg-card border-t border-border px-4 py-3 shrink-0">
        <div className="max-w-md mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${firstName}…`}
            rows={1}
            className="flex-1 px-3.5 py-2.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground leading-snug min-h-[40px] max-h-32"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
              text.trim() && !sending
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground text-center mt-1.5 max-w-md mx-auto">
          Press Enter to send · Shift+Enter for new line · Refreshes every 10s
        </p>
      </div>
    </div>
  );
}
