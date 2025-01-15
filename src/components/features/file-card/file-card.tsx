import { useImageResources } from "@/store/image-resources.store";

export function FileCard({ item, selected, onClick }: FileCardProps) {
  const imageResources = useImageResources();
  const [isHovered, setIsHovered] = useState(false);

  const handleDoubleClick = useCallback(async () => {
    if (item.type === "image") {
      // Asegurarnos de que tenemos los recursos cargados
      await imageResources.preloadResources([item.id]);
      // Abrir el visor con los recursos ya cargados
      openViewer([item], 0);
    }
  }, [item, imageResources]);

  const thumbnailUrl = useMemo(() => {
    if (item.type !== "image") return undefined;
    return imageResources.getThumbnail(item.id);
  }, [item.id, imageResources]);

  const isLoading = imageResources.isLoading(item.id);

  return (
    <motion.div
      className={cn(
        "relative group cursor-pointer",
        selected && "ring-2 ring-primary"
      )}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {item.type === "image" ? (
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <ImageFallback
              src={thumbnailUrl}
              alt={item.name}
              fill
              className="object-cover transition-all duration-200"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            />
          )}
        </div>
      ) : (
        // ... existing code for non-image files ...
      )}

      {/* ... existing code ... */}
    </motion.div>
  );
}