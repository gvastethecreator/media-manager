{
	isLoading ? (
		// Mostrar placeholders mientras carga
		<>
			{Array.from({ length: 6 }).map((_, i) => (
				<ImageLoading
					key={`loading-placeholder-${worldItemId}-${Math.random().toString(36).substr(2, 9)}`}
					backgroundColor={secondaryColor}
				/>
			))}
		</>
	) : error ? (
		// ... existing code ...
	): images.length === 0 ? (
		// ... existing code ...
	): (
			// Mostrar las imágenes disponibles
			<>
        {images.map((image, index) => (
				<div key={image.id} className="relative overflow-hidden w-full h-full">
					<img
						src={image.thumbnailUrl}
						alt={`Imagen ${index + 1}`}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				</div>
			))
}
{/* Rellena con placeholders si hay menos de 6 imágenes */ }
{
	images.length < 6 &&
	Array.from({ length: 6 - images.length }).map((_, i) => (
		<div
			key={`empty-placeholder-${worldItemId}-${Math.random().toString(36).substr(2, 9)}`}
			className="bg-black/20 w-full h-full flex items-center justify-center"
		>
			<ImageIcon className="w-5 h-5 opacity-20" />
		</div>
	))
}
    </>
)