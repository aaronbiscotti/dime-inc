interface MessageStatusProps {
  status?: "sending" | "sent" | "delivered" | "read" | "error";
  isGroupChat: boolean;
  readBy?: Record<string, string>; // userId -> timestamp
}

export function MessageStatus({
  status = "sent",
  isGroupChat,
  readBy,
}: MessageStatusProps) {
  if (status === "sending") {
    return (
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
    );
  }

  if (status === "sent") {
    return <div className="text-gray-400">✓</div>;
  }

  if (status === "delivered") {
    return <div className="text-gray-600">✓✓</div>;
  }

  if (status === "read") {
    if (isGroupChat && readBy) {
      const readCount = Object.keys(readBy).length;
      return <div className="text-blue-500 text-xs">Read by {readCount}</div>;
    }
    return <div className="text-blue-500">✓✓</div>;
  }

  if (status === "error") {
    return (
      <div className="text-red-500 font-bold" title="Failed to send">
        !
      </div>
    );
  }

  return null;
}
