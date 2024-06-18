import { prisma } from "@/lib/prisma";
import "dotenv-flow/config";

// Standardize domains into links
async function main() {
  const domains = await prisma.domain.findMany({
    include: {
      project: {
        select: {
          id: true,
          plan: true,
          users: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
    take: 5000, // TODO: Adjust this based on the number of domains
  });

  // Create links for each domain
  const newLinks = domains.map((domain) => {
    return {
      id: domain.id,
      domain: domain.slug,
      key: "_root",
      description: domain.description,
      publicStats: domain.publicStats,
      projectId: domain.projectId,
      userId: domain.project?.users[0].userId,
      createdAt: domain.createdAt,
      lastClicked: domain.lastClicked,
      clicks: domain.clicks,
      ...(domain.project?.plan === "free"
        ? {
            url: "",
            expiredUrl: null,
            rewrite: false,
            noindex: false,
          }
        : {
            url: domain.target || "",
            expiredUrl: domain.expiredUrl || null,
            rewrite: domain.type === "rewrite",
            noindex: domain.noindex,
          }),
    };
  });

  const result = await prisma.link.createMany({
    data: newLinks,
    skipDuplicates: true,
  });

  console.log(`Added ${result.count} links`);
}

main();