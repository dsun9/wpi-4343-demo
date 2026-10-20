const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");

const html = fs.readFileSync("4-conv_operation_demo.html", "utf8");

function loadConvolutionCore() {
  const start = html.indexOf("  function reflectIndex");
  const end = html.indexOf("  // Zoom/Pan viewer", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  return Function(`${html.slice(start, end)}\nreturn { conv2dDepthwise };`)();
}

test("dilation follows PyTorch Conv2d output geometry and sampling", () => {
  const { conv2dDepthwise } = loadConvolutionCore();
  const input = {
    H: 5,
    W: 5,
    C: 1,
    x: Float32Array.from({ length: 25 }, (_, index) => index + 1),
  };
  const kernel = [[1, 0, 1], [0, 0, 0], [1, 0, 1]];

  const output = conv2dDepthwise(input, kernel, 1, "valid", 0, "zero", 2);

  assert.equal(output.H, 1);
  assert.equal(output.W, 1);
  assert.equal(output.x[0], 1 + 5 + 21 + 25);
});

test("UI exposes dilation and one shared focus action", () => {
  assert.match(html, /id="dilationInp"/);
  assert.match(html, /id="focusViewportBtn"[^>]*>Focus in Viewport</);
  assert.doesNotMatch(html, /id="reset(?:In|Out)Btn"/);
});

test("padding controls follow PyTorch parameter dependencies", () => {
  assert.match(html, /<option value="zeros" selected>zeros<\/option>/);
  assert.doesNotMatch(html, /<option value="zero"/);
  assert.match(html, /els\.padModeSel\.disabled = \(t === "valid"\)/);
  assert.match(html, /els\.strideInp\.disabled = \(t === "same"\)/);
  assert.match(html, /if \(t === "same"\) els\.strideInp\.value = "1"/);
  assert.match(html, /padTop = Math\.floor\(totalPadH \/ 2\)/);
});

test("both viewers share one viewport state", () => {
  assert.match(html, /new CanvasViewer\(els\.inCanvas, viewport, drawViewers\)/);
  assert.match(html, /new CanvasViewer\(els\.outCanvas, viewport, drawViewers\)/);
  assert.match(html, /this\.onViewportChange\(\)/);
});
