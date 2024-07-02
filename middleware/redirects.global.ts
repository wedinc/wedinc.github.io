const zennBlogUrl = () => "https://zenn.dev/p/wed_engineering";
const zennArticleUrl = (slug) =>
  new URL(slug, "https://zenn.dev/wed_engineering/articles/").toString();

const redirects = {
  // '' => zennBlogUrl(),
  // '2018-19-tech-timeline': zennArticleUrl(''),
  // '2020-tech-timeline': zennArticleUrl(''),
  // '2023-gig': zennArticleUrl(''),
  // '20231116-log-analytics-using-ai': zennArticleUrl(''),
  // '20231121-executor-meets-gcsfuse': zennArticleUrl(''),
  '20231128-ruby-wasm': zennArticleUrl('use-ruby-wasm-hook'),
  // '20231222-my-3month-internship-record': zennArticleUrl(''),
  '20240127-unoptimized-next-image': zennArticleUrl('next-image-unoptimized'),
  // '20240309-resize-image': zennArticleUrl(''),
  "202405-rubykaigi-2024-akinator": zennArticleUrl("rubykaigi-2024-akinator"),
  "20240624-rubykaigi-2024-wrapparty": zennArticleUrl("c05954bb173f64"),
  // 'android-ios-life-cycle': zennArticleUrl(''),
  // 'clean-architecture-completely-understood': zennArticleUrl(''),
  // 'created-the-blog': zennArticleUrl(''),
  "datastream-for-bigquery": zennArticleUrl("97508aead20a12"),
  "datastream-partition": zennArticleUrl("datastream-partition"),
  // 'db-migration-project-management': zennArticleUrl(''),
  // 'dynamic-view-test-tips': zennArticleUrl(''),
  // 'github-org-profile': zennArticleUrl(''),
  // 'neovim-clean-config': zennArticleUrl(''),
  // 'neovim-like-a-vscode': zennArticleUrl(''),
  "start-CloudComposer": zennArticleUrl("ebdd6858394baf"),
  // 'wed-front-frameworks-2021': zennArticleUrl(''),
};

export default defineNuxtRouteMiddleware((to) => {
  const path = to.path.replace(/^\/|\/?$/g, "");
  const url = redirects[path];

  if (url !== undefined)
    return navigateTo(url, { external: true, redirectCode: 301 });
});
