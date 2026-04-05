import React, { useState } from "react";
import { TextLayoutLine, Text, View } from "react-native";
import clsx from "clsx";

import { useDeviceType } from "@/hooks/useDeviceType";
// import { IReadMoreTextProps } from "./interfaces/IReadMoreTextProps";

import { isAndroid, isiOS } from "@/lib/helpers/platform";

import { TextStyle, StyleProp, TextProps } from "react-native";
export interface IReadMoreTextProps extends TextProps {
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  children: string;
  readMoreText?: string;
  readLessText?: string;
  readMoreStyle?: StyleProp<TextStyle>;
  readLessStyle?: StyleProp<TextStyle>;
}

interface TextProperties {
  length: number;
  isTruncatedText: boolean;
}

export default function ReadMoreText({
  style,
  numberOfLines = 1,
  children,
  readMoreText = "more",
  readLessText = "less",
  readMoreStyle = { color: "black" },
  readLessStyle = { color: "black" },
  ...props
}: IReadMoreTextProps) {
  const { isIPhone16Pro } = useDeviceType();
  const [readMore, setReadMore] = useState<boolean>(false);
  const [text, setText] = useState<TextProperties>({
    length: 0,
    isTruncatedText: false,
  });
  const getReadMoreStyle = () => {
    if (readMore) {
      return readLessStyle;
    }
    return readMoreStyle;
  };

  function handleReadMoreText(textLayoutLines: TextLayoutLine[]) {
    let textLength = 0;
    if (textLayoutLines.length > numberOfLines) {
      for (var line = 0; line < numberOfLines; line++) {
        textLength += textLayoutLines[line].text.length;
      }
      setText({ length: textLength, isTruncatedText: true });
      return;
    }
    setText({ length: children.length, isTruncatedText: false });
  }

  return (
    <>
      {/** 
        iOS always requires one element without a line number 
        to determine the number of lines.
       */}
      {isiOS && (
        <Text
          style={{ height: 0 }}
          className="text-primary-dark dark:text-primary-light leading-6"
          onTextLayout={({ nativeEvent: { lines } }) => {
            if (text.length > 0) {
              return;
            }
            if (isiOS()) {
              handleReadMoreText(lines);
            }
          }}
        >
          {children}
        </Text>
      )}
      <View>
        <Text
          style={style}
          numberOfLines={text.length === 0 ? numberOfLines : 0}
          className={clsx(
            isIPhone16Pro() ? "text-base" : "text-lg",
            "text-primary-dark dark:text-primary-light leading-7"
          )}
          onTextLayout={({ nativeEvent: { lines } }) => {
            if (text.length > 0) {
              return;
            }
            if (isAndroid()) {
              handleReadMoreText(lines);
            }
          }}
          {...props}
        >
          {text.isTruncatedText && !readMore && text.length !== 0
            ? // this removes charaters from the end of the last line
              `${children.slice(0, text.length - 0).trim()}...`
            : children}
        </Text>
        {text.isTruncatedText && (
          <Text
            style={[getReadMoreStyle(), { paddingTop: 6 }]}
            className={clsx(isIPhone16Pro() ? "text-base" : "text-lg")}
            onPress={() => setReadMore(!readMore)}
          >
            {readMore ? readLessText : readMoreText}
          </Text>
        )}
      </View>
    </>
  );
}
