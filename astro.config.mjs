// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightBlog from "starlight-blog";

// https://astro.build/config
export default defineConfig({
  site: "https://julianhofer.eu",
  integrations: [
    starlight({
      plugins: [starlightBlog()],
      title: "Home",
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
      sidebar: [
        { slug: "about-me" },
        { slug: "projects" },
      ],
    }),
  ],
  redirects: {
    "/blog/01-silverblue-nix/": "/blog/2022/silverblue-nix/",
    "/blog/02-python-mail/": "/blog/2022/python-mail/",
    "/blog/03-git-forges/": "/blog/2025/git-forges/",
  },
});
