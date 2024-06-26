import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";
import codeTitle from "remark-code-title";
import remarkLinkCard from "remark-link-card";
import { rehype } from "rehype";
import rehypeHighlight from "rehype-highlight";

import { formatDate } from "@/app/lib"

const markdownSiteUrl = process.env.NEXT_PUBLIC_DOCSSITE_URL;
const publishedJsonUrl = markdownSiteUrl + "/data.json";

type JsonData = {
  slug: string;
  title: string;
  path: string;
  createdAt: string;
};

type ArticleData = {
  title: string;
  contentHtml: string;
  createdAt: string;
};

export async function fetchMarkdownJson(): Promise<JsonData[]> {
  try {
    const response = await fetch(publishedJsonUrl, { cache: "no-store" });
    const data = await response.json();
    data.sort((a: JsonData, b: JsonData) => {
      return a.createdAt < b.createdAt ? 1 : -1;
    });
    data.forEach((article: JsonData) => {
      article.createdAt = formatDate(article.createdAt);
    });
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getArticleData(slug: string): Promise<ArticleData | undefined> {
  const articles = await fetchMarkdownJson();
  const article = articles.find((article: JsonData) => article.slug === slug);

  if (article === undefined) {
    return undefined;
  }

  const title = article.title;
  const contentHtml = await getArticleContentHtml(article.path);
  const createdAt = article.createdAt;

  if (contentHtml === "") {
    return undefined;
  }

  return {
    title: title,
    contentHtml: contentHtml,
    createdAt: createdAt,
  };
}

async function getArticleContentHtml(path: string): Promise<string> {
  const absoluteUrl = new URL(path, markdownSiteUrl);
  const content = await fetch(absoluteUrl.href)
    .then((res) => res.text())
    .then((text) => replaceRelativeUrlToAbsoluteUrl(path, text))
    .then((text) => replaceCodeBlockTitle(text))
    .catch((error) => {
      console.error(error);
      return "";
    });

  const remarkContent = await remark()
    .use(remarkGfm)
    .use(codeTitle)
    .use(remarkLinkCard)
    .use(remarkHtml, { sanitize: false })
    .process(content);
  const rehypeContent = await rehype()
    .use(rehypeHighlight)
    .process(remarkContent);
  const contentHtml = rehypeContent.toString();

  return contentHtml;
}

function replaceRelativeUrlToAbsoluteUrl(path: string, content: string): string {
  const splitPath = path.split("/");
  const excludeFilenamePath = splitPath.slice(0, splitPath.length - 1).join("/");
  const absoluteUrl = new URL(excludeFilenamePath, markdownSiteUrl);

  const relativeImageRegex = /!?\[[^\]]+\]\((?!https|ftp:\/\/)[^\)]+\)/g
  const imageUrlRegex = /\]\(([^)]+)\)/

  content.match(relativeImageRegex)?.forEach((relativeImage) => {
    if (imageUrlRegex.test(relativeImage)) {
      const url = imageUrlRegex.exec(relativeImage)![1]
      content = content.replace(url, `${absoluteUrl.href}/${url}`)
    }
  })

  const relativeImageTagRegex = /<img src="(?!https|ftp:\/\/)[^"]+"/g
  const imageSrcRegex = /src="([^"]+)"/

  content.match(relativeImageTagRegex)?.forEach((relativeImageTag) => {
    if (imageSrcRegex.test(relativeImageTag)) {
      const src = imageSrcRegex.exec(relativeImageTag)![1]
      content = content.replace(src, `${absoluteUrl.href}/${src}`)
    }
  });

  return content;
}

function replaceCodeBlockTitle(content: string): string {
  const codeBlockTitleRegex = /```[a-zA-Z]+:[\w\.]+/g;
  const filenameRegex = /:[\w\.]+/;
  content.match(codeBlockTitleRegex)?.forEach((codeBlock) => {
    const filename = filenameRegex.exec(codeBlock)![0]
    content = content.replace(filename, ` title="${filename.slice(1)}"`);
    // console.log(content)
  });
  return content
}
