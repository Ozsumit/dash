const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting SEO backfill...");

  // 1. Fetch ALL posts including the SEO relation
  // This avoids the 'where' filter syntax issues on relations entirely
  const allPosts = await prisma.post.findMany({
    include: { seo: true },
  });

  // 2. Filter in JavaScript to find ones missing SEO
  const postsMissingSeo = allPosts.filter((p: any) => !p.seo);

  console.log(
    `Found ${postsMissingSeo.length} posts missing SEO. Generating...`,
  );

  for (const post of postsMissingSeo) {
    await prisma.seo.create({
      data: {
        // Connect to the existing Post ID
        postId: post.id,

        // Generate default data
        metaTitle: post.title.substring(0, 60),
        metaDescription: post.excerpt
          ? post.excerpt.substring(0, 160)
          : post.title,
        ogType: "article",
        noIndex: false,
      },
    });
    process.stdout.write("."); // Progress indicator
  }

  console.log(
    `\n\nSuccess! Backfilled SEO for ${postsMissingSeo.length} posts.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
