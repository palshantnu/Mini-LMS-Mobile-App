import { Image, ImageProps } from "expo-image";
import { cssInterop } from "nativewind";

const StyledImage = cssInterop(Image, { className: "style" });

export function CachedImage(props: ImageProps & { className?: string }) {
  return (
    <StyledImage
      cachePolicy="memory-disk"
      transition={300}
      {...props}
    />
  );
}
