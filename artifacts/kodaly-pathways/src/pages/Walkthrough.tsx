import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Music, ArrowLeft, PlayCircle } from "lucide-react";
import { useGetPageBySlug } from "@workspace/api-client-react";
import { PageRenderer } from "@/components/PageRenderer";
import { VideoExplainer } from "@/components/VideoExplainer";

export default function WalkthroughPage() {
  const [explainerOpen, setExplainerOpen] = useState(false);
  const { data: page, isLoading, error } = useGetPageBySlug("walkthrough");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/70 dark:bg-background/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <span className="font-semibold">
              Kodály<span className="italic text-primary"> Pathways</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setExplainerOpen(true)} data-testid="button-video-explainer">
              <PlayCircle className="w-4 h-4 mr-1" /> Video explainer
            </Button>
            <Button asChild variant="ghost" size="sm" data-testid="link-back-login">
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to sign in
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="max-w-6xl mx-auto px-6 py-16 text-muted-foreground">Loading…</div>
      )}
      {error && !page && (
        <div className="max-w-6xl mx-auto px-6 py-16 text-muted-foreground">
          The walkthrough page couldn't be loaded.
        </div>
      )}
      {page && <PageRenderer page={page} />}

      <VideoExplainer open={explainerOpen} onClose={() => setExplainerOpen(false)} />
    </div>
  );
}
