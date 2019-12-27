import React, { useCallback, useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import getBoxShadow from "../../utils/getBoxShadow";
import svgIcons from "../../svg/icons";
import { keepNotificationAlive, removeNotification } from "../../redux/actions";
const {
  info: infoSvgIcon,
  warn: warnSvgIcon,
  success: successSvgIcon,
  close: closeSvgIcon
} = svgIcons;

const ToastContainer = styled(({ className = "" }) => {
  className += " ToastContainer";
  const { cards } = useSelector(state => state.notifications);
  const dispatch = useDispatch();
  //cards is a Map of key, values
  //for all cards with allowHideHide ! false, after 5 seconds, delete them.
  //if after 5 seconds allowAutoHide is false, don't hide it, else do.
  const cardsArray = Array.from(cards);
  const [cardsToRemove, setCardsToRemove] = useState({});
  useEffect(() => {
    cardsArray.forEach(([key, { allowAutoHide }]) => {
      if (allowAutoHide) {
        if (!cardsToRemove[key]) {
          const timeoutId = setTimeout(() => {
            if (cards.has(key) && cards.get(key).allowAutoHide) {
              dispatch(removeNotification(key));
            } else {
              console.warn("card no longer can be removed!");
            }
          }, 5000);
          setCardsToRemove(cardsToRemove => ({
            ...cardsToRemove,
            [key]: timeoutId
          }));
        }
      } else if (cardsToRemove[key]) {
        setCardsToRemove(cardsToRemove => {
          delete cardsToRemove[key];
          return cardsToRemove;
        });
      }
    });
  }, [cardsArray]);
  return (
    <div className={className}>
      {cardsArray.map(([key, card], index) => {
        const styleData = dataFromType(card.type);
        return (
          <Toast
            index={index}
            className="ToastCard"
            key={key}
            text={card.text}
            styleData={styleData}
            onClickBody={() => dispatch(keepNotificationAlive(key))}
            onClose={() => dispatch(removeNotification(key))}
          />
        );
      })}
    </div>
  );
})`
  font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont,
    "Helvetica Neue", Helvetica, sans-serif;
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.4;
  text-rendering: optimizeLegibility;
  box-sizing: border-box;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  pointer-events: auto;
  position: fixed;
  bottom: 0px;
  right: 0px;
  padding: 8px;
  z-index: 9000;
  display: flex;
  flex-direction: column;
`;

const dataFromType = type => {
  switch (type) {
    case "info": {
      return {
        styleData: {
          icon: infoSvgIcon,
          textColour: "rgb(80, 95, 121)",
          tabColour: "rgb(38, 132, 255)",
          bgColour: "rgb(255,255,255)"
        }
      };
    }
    case "warn": {
      return {
        styleData: {
          icon: warnSvgIcon,
          textColour: "rgb(255, 139, 0)",
          tabColour: "rgb(255, 171, 0)",
          bgColour: "rgb(255, 250, 230)"
        }
      };
    }
    case "success": {
      return {
        styleData: {
          icon: successSvgIcon,
          textColour: "rgb(0, 102, 68)",
          tabColour: "rgb(54, 179, 126)",
          bgColour: "rgb(227, 252, 239)"
        }
      };
    }
    default: {
      return { icon: null };
    }
  }
};
//TODO: refactor code so props are passed explicitly
const Toast = styled(
  ({
    className = "",
    index = 0,
    text,
    type,
    styleData: { icon },
    onClickBody = Function.prototype,
    onClose = Function.prototype
  }) => {
    className += " Toast";
    const toastRef = useRef(null);
    const { cards } = useSelector(state => state.notifications);
    //const [{ cards }] = useStateValue();
    //TODO: does this update unecessarily or can I leave it for every render?
    useEffect(() => {
      toastRef.current.style.opacity = (index + 1) / cards.size;
    });
    /* <div className={className} {...props}>
        {text}
      </div> 
      
      */
    return (
      <div className={className} ref={toastRef}>
        <div className="ToastIconTab" onClick={onClickBody}>
          <div />
          {icon}
        </div>
        <div className="ToastContent" onClick={onClickBody}>
          {text}
        </div>
        <div role="button" className="ToastCloseButton" onClick={onClose}>
          {closeSvgIcon}
          <span>Close</span>
        </div>
      </div>
    );
  }
)`
  ${({ styleData: { bgColour, textColour, tabColour } }) => {
    return `
      font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif;
      font-size: 18px;
      font-style: normal;
      font-weight: 400;
      line-height: 1.4;
      text-rendering: optimizeLegibility;
      pointer-events: auto;
      background-color: ${bgColour};
      ${getBoxShadow({
        colour: "rgba(0, 0, 0, 0.176)",
        y: "3px",
        blur: "8px"
      })}   
      color: ${textColour};
      display: flex;
      margin-bottom: 8px;
      width: 360px;
      max-width: calc(100% - 16px);
      transform: translate3d(0px, 0px, 0px);
      border-radius: 4px;
      float: right;
      transition: transform 220ms cubic-bezier(0.2, 0, 0, 1) 0s;
      .ToastIconTab {
        background-color: ${tabColour};
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        color: ${bgColour};
        flex-shrink: 0;
        padding-bottom: 8px;
        padding-top: 8px;
        position: relative;
        text-align: center;
        width: 30px;
        overflow: hidden;
        > div {
          color: ${bgColour};
          text-align: center;
          background-color: rgba(0, 0, 0, 0.1);
          bottom: 0px;
          height: 0px;
          left: 0px;
          opacity: 0;
          position: absolute;
          width: 100%;
          animation: 5000ms linear 0s 1 normal none paused animation-1kpkwyo-shrink;
        }
        > svg {
          text-align: center;
          position: relative;
          z-index: 1;
          display: inline-block;
          vertical-align: text-top;
          fill: currentColor;
        }
      }
      .ToastContent {
        color: ${textColour};
        flex-grow: 1;
        font-size: 14px;
        line-height: 1.4;
        min-height: 40px;
        padding: 8px 12px;
      }
      .ToastCloseButton {
        color: ${textColour};
        cursor: pointer;
        flex-shrink: 0;
        opacity: 0.5;
        padding: 8px 12px;
        transition: opacity 150ms ease 0s;
        > svg {
          color: ${textColour};
          cursor: pointer;
          display: inline-block;
          vertical-align: text-top;
          fill: currentColor;
        }
        > span {
          cursor: pointer;
          clip: rect(1px, 1px, 1px, 1px);
          height: 1px;
          position: absolute;
          white-space: nowrap;
          width: 1px;
          border-width: 0px;
          border-style: initial;
          border-color: initial;
          border-image: initial;
          overflow: hidden;
          padding: 0px;
        }
      }
        
    `;
  }}
`;

export { ToastContainer };
