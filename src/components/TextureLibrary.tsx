import { Palette } from "lucide-react";
import { generatedTextures } from "../data/textures";

export function TextureLibrary() {
  return (
    <section className="panel texture-panel" aria-label="Generated material texture library">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Generated assets</p>
          <h2>Material texture library</h2>
        </div>
        <Palette aria-hidden="true" />
      </div>
      <div className="texture-grid">
        {Object.values(generatedTextures).map((texture) => (
          <article className="texture-card" key={texture.id}>
            <img src={texture.filePath} alt={`${texture.label} texture swatch`} />
            <div>
              <h3>{texture.label}</h3>
              <p>{texture.intendedUse}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
