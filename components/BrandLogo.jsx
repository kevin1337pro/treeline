const TREELINE_BRAND_ASSETS = {
  horizontal: { file: "logos/treeline-horizontal-600", width: 600, height: 184 },
  dark: { file: "logos/treeline-horizontal-dark-600", width: 600, height: 200 },
  stacked: { file: "logos/treeline-stacked-400", width: 400, height: 349 },
  symbol: { file: "icons/treeline-symbol-128", width: 128, height: 128 },
};

function BrandLogo({ variant = "horizontal", className = "", alt = "Treeline" }) {
  const asset = TREELINE_BRAND_ASSETS[variant] || TREELINE_BRAND_ASSETS.horizontal;
  const path = `assets/brand/${asset.file}`;
  return <picture className={`brand-logo ${className}`}>
    {variant !== "symbol" && <source srcSet={`${path}.webp`} type="image/webp"/>}
    <img src={`${path}.png`} width={asset.width} height={asset.height} alt={alt} draggable="false"/>
  </picture>;
}

Object.assign(window, { BrandLogo });
