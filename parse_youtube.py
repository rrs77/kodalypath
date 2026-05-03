import re
import json

def get_yt_initial_data(filename):
    try:
        with open(filename, "r") as f:
            content = f.read()
        match = re.search(r"ytInitialData = (\{.*?\});</script>", content)
        if match:
            return json.loads(match.group(1))
    except:
        pass
    return None

def find_video_renderers(obj):
    renderers = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ["videoRenderer", "gridVideoRenderer"]:
                renderers.append(v)
            else:
                renderers.extend(find_video_renderers(v))
    elif isinstance(obj, list):
        for item in obj:
            renderers.extend(find_video_renderers(item))
    return renderers

def get_title(renderer):
    try:
        return renderer["title"]["runs"][0]["text"]
    except:
        try:
            return renderer["title"]["simpleText"]
        except:
            return None

def get_vid(renderer):
    return renderer.get("videoId")

all_videos = {}

for filename in ["videos.html", "featured.html", "playlists.html"]:
    data = get_yt_initial_data(filename)
    if data:
        renderers = find_video_renderers(data)
        for r in renderers:
            title = get_title(r)
            vid = get_vid(r)
            if title and vid:
                all_videos[vid] = title

# Output sorted by title
for vid in sorted(all_videos, key=lambda x: all_videos[x]):
    title = all_videos[vid]
    print(f"{title} — https://www.youtube.com/watch?v={vid}")
