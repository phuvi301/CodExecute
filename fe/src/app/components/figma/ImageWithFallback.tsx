import { useEffect, useState } from 'react';

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement>;

export function ImageWithFallback({ alt = 'Image', src, className, onError, ...props }: ImageWithFallbackProps) {
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		setHasError(false);
	}, [src]);

	if (!src || hasError) {
		return (
			<div
				className={['flex items-center justify-center bg-muted text-muted-foreground', className]
					.filter(Boolean)
					.join(' ')}
				aria-label={alt}
			>
				<span className="px-3 text-center text-sm">{alt}</span>
			</div>
		);
	}

	return (
		<img
			alt={alt}
			src={src}
			className={className}
			onError={(event) => {
				setHasError(true);
				onError?.(event);
			}}
			{...props}
		/>
	);
}