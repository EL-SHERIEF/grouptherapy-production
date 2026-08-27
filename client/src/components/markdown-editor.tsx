import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link,
  List,
  ListOrdered,
  Eye,
  Edit,
} from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline">$1</a>');
  
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>');
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$2</li>');
  
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('list-decimal')) {
      return `<ol class="my-2 space-y-1">${match}</ol>`;
    }
    return `<ul class="my-2 space-y-1">${match}</ul>`;
  });
  
  const htmlTagPattern = /<(h[1-6]|p|div|span|a|strong|em|b|i|ul|ol|li|br|hr|blockquote|pre|code|table|tr|td|th|thead|tbody|img|video|audio|iframe|section|article|header|footer|nav|aside|figure|figcaption)[^>]*>[\s\S]*?<\/\1>|<(br|hr|img)[^>]*\/?>/gi;
  const hasRawHtml = htmlTagPattern.test(markdown);
  
  if (!hasRawHtml) {
    html = html.replace(/\n\n/g, '</p><p class="mb-4">');
    html = `<p class="mb-4">${html}</p>`;
    
    html = html.replace(/<p class="mb-4"><\/p>/g, '');
    html = html.replace(/<p class="mb-4">(<h[1-3])/g, '$1');
    html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
    html = html.replace(/<p class="mb-4">(<[uo]l)/g, '$1');
    html = html.replace(/(<\/[uo]l>)<\/p>/g, '$1');
  }
  
  return html;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  minHeight = "300px",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  
  const html = useMemo(() => renderMarkdown(value), [value]);
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html]);
  
  const insertText = useCallback((before: string, after: string = "", placeholder: string = "") => {
    const textarea = document.querySelector('#markdown-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(
        selectedText ? newCursorPos + after.length : start + before.length,
        selectedText ? newCursorPos + after.length : start + before.length + textToInsert.length
      );
    }, 0);
  }, [value, onChange]);

  const insertAtLineStart = useCallback((prefix: string) => {
    const textarea = document.querySelector('#markdown-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }, [value, onChange]);

  const handleBold = () => insertText("**", "**", "bold text");
  const handleItalic = () => insertText("*", "*", "italic text");
  const handleH1 = () => insertAtLineStart("# ");
  const handleH2 = () => insertAtLineStart("## ");
  const handleH3 = () => insertAtLineStart("### ");
  const handleLink = () => insertText("[", "](url)", "link text");
  const handleBulletList = () => insertAtLineStart("- ");
  const handleNumberedList = () => insertAtLineStart("1. ");

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b bg-muted/30 px-2 py-1">
        <div className="flex items-center gap-1 w-full overflow-x-auto sm:overflow-visible min-w-max">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleH1}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleH2}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleH3}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleBold}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleItalic}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleLink}
            title="Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleBulletList}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNumberedList}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview")}>
          <TabsList className="h-8">
            <TabsTrigger value="write" className="h-6 px-2 text-xs gap-1">
              <Edit className="h-3 w-3" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-6 px-2 text-xs gap-1">
              <Eye className="h-3 w-3" />
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {activeTab === "write" ? (
        <Textarea
          id="markdown-editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-0 rounded-none focus-visible:ring-0 resize-none"
          style={{ minHeight }}
        />
      ) : (
        <div 
          className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/10"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml || '<p class="text-muted-foreground">Nothing to preview</p>' }}
        />
      )}
    </div>
  );
}

export function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html]);
  
  return (
    <div 
      className="prose prose-sm dark:prose-invert max-w-none min-h-[300px] p-4 border rounded-md bg-muted/30"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
