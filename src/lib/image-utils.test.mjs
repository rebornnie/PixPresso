import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { compressImage, compressToTargetSize, getImageFormat, resizeImage } from "./image-utils.ts";

const originalImage = globalThis.Image;
const originalDocument = globalThis.document;

afterEach(() => {
  globalThis.Image = originalImage;
  globalThis.document = originalDocument;
});

test("unsupported image formats are rejected instead of labeled JPEG", () => {
  assert.equal(getImageFormat({ type: "image/gif", name: "animated.gif" }), null);
  assert.equal(getImageFormat({ type: "", name: "photo.webp" }), "image/webp");
});

test("JPEG export fills transparent pixels white before drawing the image", async () => {
  const operations = [];
  const context = {
    fillStyle: "",
    fillRect: (...args) => operations.push(["fill", context.fillStyle, ...args]),
    drawImage: () => operations.push(["draw"]),
  };
  globalThis.Image = class {
    naturalWidth = 2;
    naturalHeight = 3;
    set src(_) { queueMicrotask(() => this.onload()); }
  };
  globalThis.document = {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => context,
      toBlob: (callback) => callback(new Blob(["jpeg"], { type: "image/jpeg" })),
    }),
  };

  const result = await compressImage("blob:transparent-png", "image/jpeg", 80);
  assert.equal(result.type, "image/jpeg");
  assert.deepEqual(operations, [
    ["fill", "#FFFFFF", 0, 0, 2, 3],
    ["draw"],
  ]);
});

test("unsupported canvas export does not return a mislabeled image", async () => {
  globalThis.Image = class {
    naturalWidth = 1;
    naturalHeight = 1;
    set src(_) { queueMicrotask(() => this.onload()); }
  };
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({ drawImage() {} }),
      toBlob: (callback) => callback(new Blob(["png"], { type: "image/png" })),
    }),
  };

  await assert.rejects(
    compressImage("blob:source", "image/webp", 80),
    /Unsupported output format/
  );
});

test("resize rejects invalid pixel dimensions before creating a canvas", async () => {
  for (const [width, height] of [[0, 100], [10001, 100], [10.5, 100]]) {
    await assert.rejects(
      resizeImage("blob:source", width, height, "image/png", 90),
      /Invalid target dimensions/
    );
  }
});


function mockTargetSizeCanvas(naturalWidth, naturalHeight, sizeFor) {
  globalThis.Image = class {
    naturalWidth = naturalWidth;
    naturalHeight = naturalHeight;
    set src(_) { queueMicrotask(() => this.onload()); }
  };
  globalThis.document = {
    createElement: () => {
      const canvas = { width: 0, height: 0 };
      canvas.getContext = () => ({ drawImage() {}, fillRect() {}, fillStyle: "" });
      canvas.toBlob = (callback, format, quality) =>
        callback(
          new Blob([new Uint8Array(sizeFor(canvas, Math.round(quality * 100)))], {
            type: format,
          })
        );
      return canvas;
    },
  };
}

test("target size search finds the highest quality within budget", async () => {
  mockTargetSizeCanvas(100, 100, (_canvas, quality) => quality * 1000);
  const result = await compressToTargetSize("blob:source", "image/jpeg", 55000);
  assert.equal(result.achieved, true);
  assert.equal(result.quality, 55);
  assert.equal(result.scale, 1);
  assert.equal(result.blob.size, 55000);
});

test("target size search shrinks dimensions when the quality floor is reached", async () => {
  mockTargetSizeCanvas(1000, 1000, (canvas, quality) => quality * canvas.width);
  const result = await compressToTargetSize("blob:source", "image/jpeg", 500);
  assert.equal(result.achieved, true);
  assert.ok(result.scale < 1);
  assert.ok(result.blob.size <= 500);
});

test("target size search reports the smallest result when the target is unreachable", async () => {
  mockTargetSizeCanvas(64, 64, (_canvas, quality) => quality * 100);
  const result = await compressToTargetSize("blob:source", "image/jpeg", 50);
  assert.equal(result.achieved, false);
  assert.equal(result.blob.size, 100);
});

test("target size search rejects a non-positive target before loading", async () => {
  await assert.rejects(
    compressToTargetSize("blob:source", "image/jpeg", 0),
    /Invalid target size/
  );
});
