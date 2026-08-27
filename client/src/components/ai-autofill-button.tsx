import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { generateContent, isGeminiConfigured } from '@/lib/gemini';
import { cn } from '@/lib/utils';

interface AIAutofillButtonProps {
  fieldName: string;
  currentValue?: string;
  onGenerate: (generatedContent: string) => void;
  context?: string;
  className?: string;
  disabled?: boolean;
}

export function AIAutofillButton({
  fieldName,
  currentValue,
  onGenerate,
  context,
  className,
  disabled = false,
}: AIAutofillButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    try {
      const prompt = buildPrompt(fieldName, currentValue, context);
      const result = await generateContent(prompt);
      
      if (!result.startsWith('Error:')) {
        onGenerate(result.trim());
      } else {
        console.error('AI generation failed:', result);
      }
    } catch (error) {
      console.error('AI autofill error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isGeminiConfigured()) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', className)}
          onClick={handleGenerate}
          disabled={isLoading || disabled}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Generate with AI</p>
      </TooltipContent>
    </Tooltip>
  );
}

function buildPrompt(fieldName: string, currentValue?: string, context?: string): string {
  let prompt = `Generate content for the field "${fieldName}"`;
  
  if (context) {
    prompt += `. Context: ${context}`;
  }
  
  if (currentValue) {
    prompt += `. Current value for reference: "${currentValue}"`;
  }
  
  prompt += '. Provide only the content, no explanations or quotes.';
  
  return prompt;
}
