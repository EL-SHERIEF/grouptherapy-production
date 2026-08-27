
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, ThumbsUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  username: string;
  content: string;
  timestamp: Date;
  likes: number;
}

interface CommentsSectionProps {
  postId: string;
  initialComments?: Comment[];
}

const userColors = [
  { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { text: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { text: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  { text: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
];

function getUserColor(username: string): { text: string; bg: string; border: string } {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % userColors.length;
  return userColors[index] ?? { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
}

export function CommentsSection({ postId, initialComments = [] }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [username] = useState(`User${Math.floor(Math.random() * 1000)}`);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      username,
      content: newComment,
      timestamp: new Date(),
      likes: 0,
    };

    setComments((prev) => [comment, ...prev]);
    setNewComment("");
  };

  const handleLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, likes: comment.likes + 1 }
          : comment
      )
    );
  };

  return (
    <Card className="border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MessageSquare className="h-5 w-5 text-primary" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Comment Input */}
        <div className="space-y-3">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="bg-background border-input text-foreground placeholder:text-muted-foreground resize-none"
            data-testid="textarea-new-comment"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="button-submit-comment"
            >
              <Send className="h-4 w-4" />
              Post Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          <AnimatePresence>
            {comments.map((comment) => {
              const userColor = getUserColor(comment.username);
              return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-3 p-4 rounded-lg bg-muted/50 border border-border"
                  data-testid={`comment-${comment.id}`}
                >
                  <Avatar className={cn("h-10 w-10 flex-shrink-0", userColor.border, "border")}>
                    <AvatarFallback className={cn(userColor.bg, userColor.text, "font-medium")}>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-semibold text-sm", userColor.text)}>{comment.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {comment.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground break-words">{comment.content}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleLike(comment.id)}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        {comment.likes > 0 && (
                          <span className="text-xs">{comment.likes}</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {comments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
