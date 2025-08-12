// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightBlog from "starlight-blog";

const site = "https://julianhofer.eu";

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    starlight({
      plugins: [starlightBlog()],
      title: "Home",
      favicon: "favicon.ico",
      customCss: ["./src/styles/custom.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/Hofer-Julian",
        },
        {
          href: "https://chaos.social/@ju",
          icon: "mastodon",
          label: "Mastodon",
        },
        {
          href: "https://www.linkedin.com/in/hofer-julian/",
          icon: "linkedin",
          label: "LinkedIn",
        },
        {
          href: "mailto:julianhofer@gnome.org",
          icon: "email",
          label: "Email",
        },
      ],
      	head: [
				{
					tag: 'meta',
					attrs: { property: 'og:image', content: site + '/og.png?v=1' },
				},
				{
					tag: 'meta',
					attrs: { property: 'twitter:image', content: site + '/og.png?v=1' },
				},
			],
      sidebar: [{ slug: "about-me" }],
    }),
  ],
  redirects: {
    "/blog/01-silverblue-nix/": "/blog/2022/silverblue-nix/",
    "/blog/02-python-mail/": "/blog/2022/python-mail/",
    "/blog/03-git-forges/": "/blog/2025/git-forges/",
  },
});
