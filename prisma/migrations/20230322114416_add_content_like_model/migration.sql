-- CreateTable
CREATE TABLE "content_likes" (
    "id" SERIAL NOT NULL,
    "contentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isLike" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_likes_contentId_userId_idx" ON "content_likes"("contentId", "userId");

-- AddForeignKey
ALTER TABLE "content_likes" ADD CONSTRAINT "content_likes_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_likes" ADD CONSTRAINT "content_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
