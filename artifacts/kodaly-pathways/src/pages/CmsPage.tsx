import { Link, useRoute } from "wouter";
import { Music, ArrowLeft } from "lucide-react";
import { useGetPageBySlug } from "@workspace/api-client-react";
import { PageRenderer } from "@/components/PageRenderer";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/lib/site-settings";

/**
 * Public renderer for any CMS page at `/p/:slug`. Lets admins create
 * pages on the fly (about, terms, etc.) without a code change.
 */
export default function CmsPage() {
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug ?? "";
  const { data: page, isLoading, error } = useGetPageBySlug(slug);
  const settings = useSiteSettings();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/70 dark:bg-background/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover-elevate rounded-md px-2 py-1">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="" className="w-8 h-8 rounded-md object-contain bg-white" />
            ) : (
              <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center"><Music className="w-4 h-4" /></div>
            )}
            <span className="font-semibold">{settings.siteName}</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login"><ArrowLeft className="w-4 h-4 mr-1" /> Sign in</Link>
          </Button>
        </div>
      </header>

      {isLoading && <div className="max-w-6xl mx-auto px-6 py-16 text-muted-foreground">Loading…</div>}
      {(error || (!isLoading && !page)) && (
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="text-muted-foreground mt-2">The page <code>/{slug}</code> doesn't exist or isn't published yet.</p>
        </div>
      )}
      {page && <PageRenderer page={page} />}
    </div>
  );
}
