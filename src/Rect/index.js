import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import { getLength, getAngle, getCursor } from "../utils";
import StyledRect from "./StyledRect";

const zoomableMap = {
  n: "t",
  s: "b",
  e: "r",
  w: "l",
  ne: "tr",
  nw: "tl",
  se: "br",
  sw: "bl"
};

export default class Rect extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ]),
    onResizeStart: PropTypes.func,
    onResize: PropTypes.func,
    onResizeEnd: PropTypes.func,
    onRotateStart: PropTypes.func,
    onRotate: PropTypes.func,
    onRotateEnd: PropTypes.func,
    onDragStart: PropTypes.func,
    onDrag: PropTypes.func,
    onDragEnd: PropTypes.func,
    parentRotateAngle: PropTypes.number,
    rotatable: PropTypes.bool,
    styles: PropTypes.object,
    zoomable: PropTypes.string
  };

  static defaultProps = {
    className: ""
  };

  setElementRef = ref => {
    this.$element = ref;
  };

  onMove = (type, origin = {}) => e => {
    if (!this._isMouseDown) return;
    e.stopImmediatePropagation();
    const { clientX, clientY } = e;
    const { center = {} } = origin;
    const deltaX = clientX - origin.startX;
    const deltaY = clientY - origin.startY;
    const alpha = Math.atan2(deltaY, deltaX);
    const deltaL = getLength(deltaX, deltaY);
    const isShiftKey = e.shiftKey;
    const rotateVector = {
      x: clientX - center.x,
      y: clientY - center.y
    };
    const angle = getAngle(origin.startVector, rotateVector);

    switch (type) {
      case "rotate":
        return this.props.onRotate(angle, origin.startAngle);
      case "resize":
        return this.props.onResize(
          deltaL,
          alpha,
          origin.rect,
          type,
          isShiftKey
        );
      default:
        this.props.onDrag(deltaX, deltaY);
        origin.startX = clientX;
        origin.startY = clientY;
    }
  };

  // Drag
  startDrag = e => {
    let { clientX: startX, clientY: startY } = e;
    this.props.onDragStart && this.props.onDragStart();
    this._isMouseDown = true;

    const onMove = this.onMove("drag", { startX, startY });

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (!this._isMouseDown) return;
      this._isMouseDown = false;
      this.props.onDragEnd && this.props.onDragEnd();
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Rotate
  startRotate = e => {
    if (e.button !== 0) return;
    const { clientX, clientY } = e;
    const {
      styles: {
        transform: { rotateAngle: startAngle }
      }
    } = this.props;
    const rect = this.$element.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    this.props.onRotateStart && this.props.onRotateStart();
    this._isMouseDown = true;

    const onMove = this.onMove("rotate", {
      center,
      startAngle,
      startVector: {
        x: clientX - center.x,
        y: clientY - center.y
      }
    });
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (!this._isMouseDown) return;
      this._isMouseDown = false;
      this.props.onRotateEnd && this.props.onRotateEnd();
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Resize
  startResize = (e, cursor) => {
    if (e.button !== 0) return;
    document.body.style.cursor = cursor;
    const {
      styles: {
        position: { centerX, centerY },
        size: { width, height },
        transform: { rotateAngle }
      }
    } = this.props;
    const { clientX: startX, clientY: startY } = e;
    this.props.onResizeStart && this.props.onResizeStart();
    this._isMouseDown = true;

    const onMove = this.onMove("resize", {
      startX,
      startY,
      rect: { width, height, centerX, centerY, rotateAngle },
      type: e.target.getAttribute("class").split(" ")[0]
    });

    const onUp = () => {
      document.body.style.cursor = "auto";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (!this._isMouseDown) return;
      this._isMouseDown = false;
      this.props.onResizeEnd && this.props.onResizeEnd();
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  render = () => {
    const {
      children,
      className,
      styles: {
        position: { centerX, centerY },
        size: { width, height },
        transform: { rotateAngle }
      },
      zoomable,
      rotatable,
      parentRotateAngle
    } = this.props;
    const style = {
      width: Math.abs(width),
      height: Math.abs(height),
      transform: `rotate(${rotateAngle}deg)`,
      left: centerX - Math.abs(width) / 2,
      top: centerY - Math.abs(height) / 2
    };
    const direction = zoomable
      .split(",")
      .map(d => d.trim())
      .filter(d => d); // TODO: may be speed up

    return (
      <StyledRect
        ref={this.setElementRef}
        onMouseDown={this.startDrag}
        className={`rect single-resizer ${className}`}
        style={style}
      >
        {rotatable && (
          <div className="rotate" onMouseDown={this.startRotate}>
            <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10.536 3.464A5 5 0 1 0 11 10l1.424 1.425a7 7 0 1 1-.475-9.374L13.659.34A.2.2 0 0 1 14 .483V5.5a.5.5 0 0 1-.5.5H8.483a.2.2 0 0 1-.142-.341l2.195-2.195z"
                fill="#eb5648"
                fillRule="nonzero"
              />
            </svg>
          </div>
        )}

        {direction.map(d => {
          const cursor = `${getCursor(
            rotateAngle + parentRotateAngle,
            d
          )}-resize`;
          return (
            <div
              key={d}
              style={{ cursor }}
              className={`${zoomableMap[d]} resizable-handler`}
              onMouseDown={e => this.startResize(e, cursor)}
            />
          );
        })}

        {direction.map(d => {
          return <div key={d} className={`${zoomableMap[d]} square`} />;
        })}
        {children}
      </StyledRect>
    );
  };
}
