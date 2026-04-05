import {
  View,
  Text,
  TextInput,
  TextInputProps,
  useWindowDimensions,
  Pressable,
  KeyboardTypeOptions,
  StyleSheet,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { useDeviceType } from "@/hooks/useDeviceType";
import { cn } from "@/lib/helpers/cn";

interface InputFieldProps extends TextInputProps {
  title?: string;
  value: string;
  handleChange: (text: string) => void;
  onBlur?: () => void;
  className?: string;
  containerClassName?: string;
  pressableClassName?: string;
  textClassName?: string;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  rounded?: "default" | "full";
  style?: any;
  inputStyle?: any;
}

const InputField = ({
  title,
  value,
  handleChange,
  onBlur,
  className,
  containerClassName,
  pressableClassName,
  textClassName,
  keyboardType,
  placeholder,
  rounded = "default",
  style,
  inputStyle,
  ...props
}: InputFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { isIPhone16Pro, isIpad } = useDeviceType();

  return (
    <View style={style} className={cn("flex-col gap-1", containerClassName)}>
      {title && (
        <Text
          className={cn(
            isIpad() ? "text-xl" : isIPhone16Pro() ? "text-base" : "text-lg",
            "font-body-medium text-foreground-light dark:text-foreground-dark opacity-80"
          )}
        >
          {title}
        </Text>
      )}

      <Pressable
        className={cn(
          "w-full",
          "bg-inputGray-light dark:bg-inputGray-dark",
          "border-2",
          rounded === "default" ? "rounded-2xl" : "rounded-full",
          "flex-row",
          pressableClassName,
          isFocused
            ? "border-foreground-light dark:border-foreground-dark"
            : "border-border-light dark:border-border-dark"
        )}
      >
        <TextInput
          className={cn(
            isIpad() ? "p-4 text-xl" : isIPhone16Pro() ? "p-2 text-base" : "p-3 text-lg",
            "flex-1",
            "text-foreground-light dark:text-foreground-dark",
            "font-body",
            "leading-6",
            textClassName
          )}
          style={[{ minHeight: 40 }, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor="#78716C"
          value={value}
          onChangeText={handleChange}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          {...props}
        />
      </Pressable>
    </View>
  );
};

interface AutoExpandTextInputProps extends TextInputProps {
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  containerClassName?: string;
  title?: string;
  rounded?: "default" | "full";
  pressableClassName?: string;
  style?: any;
  inputStyle?: any;
  onBlur?: () => void;
}

export const AutoExpandTextInput: React.FC<AutoExpandTextInputProps> = ({
  value,
  placeholder,
  title,
  onChangeText,
  onContentSizeChange,
  minHeight = 220,
  maxHeight: propMaxHeight,
  style,
  inputStyle,
  className,
  containerClassName,
  pressableClassName,
  onBlur,
  rounded = "default",
  ...props
}) => {
  const { isIPhone16Pro, isIpad } = useDeviceType();
  const { height: windowHeight } = useWindowDimensions();

  // If no maxHeight prop, default to 80% of the screen height
  const maxHeight = propMaxHeight || windowHeight * 0.8;

  // Track whether we're focused just to show a different border color (if desired)
  const [isFocused, setIsFocused] = useState(false);

  // The height we will apply to the TextInput
  const [height, setHeight] = useState<number>(minHeight);

  const inputRef = useRef<TextInput>(null);

  /**
   * Whenever the content changes, measure how tall it wants to be:
   * - At least minHeight
   * - Never exceed maxHeight
   */
  const handleContentSizeChange = (e: any) => {
    const measuredHeight = e.nativeEvent.contentSize.height;
    const newHeight = Math.max(minHeight, measuredHeight);
    setHeight(Math.min(newHeight, maxHeight));

    // If parent needs the onContentSizeChange event
    onContentSizeChange?.(e);
  };

  /**
   * Optionally reset the height to minHeight if the value is cleared out.
   * Remove this effect if you'd rather let it shrink below minHeight.
   */
  useEffect(() => {
    if (!value) {
      setHeight(minHeight);
    }
  }, [value, minHeight]);

  return (
    <View
      style={style}
      className={cn("flex-col w-full gap-1", containerClassName)}
    >
      {title && (
        <Text
          className={cn(
            isIpad() ? "text-xl" : isIPhone16Pro() ? "text-base" : "text-lg",
            "font-body-medium text-foreground-light dark:text-foreground-dark opacity-80"
          )}
        >
          {title}
        </Text>
      )}

      <Pressable
        className={cn(
          "w-full",
          "bg-inputGray-light dark:bg-inputGray-dark",
          "border-2",
          rounded === "default" ? "rounded-2xl" : "rounded-full",
          "items-center flex-row",
          pressableClassName,
          isFocused
            ? "border-foreground-light dark:border-foreground-dark"
            : "border-border-light dark:border-border-dark"
        )}
      >
        <TextInput
          ref={inputRef}
          multiline
          scrollEnabled
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#78716C"
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          onContentSizeChange={handleContentSizeChange}
          style={[styles.input, { height }, inputStyle]}
          className={cn(
            "text-foreground-light dark:text-foreground-dark border-none w-full font-body",
            isIpad()
              ? "p-4 pb-5 pt-4 text-xl"
              : isIPhone16Pro()
              ? "p-2 pb-3 pt-2 text-base"
              : "p-3 pb-4 pt-3 text-lg",
            className
          )}
          {...props}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    textAlignVertical: "top",
  },
});

// interface AutoExpandTextInputProps extends TextInputProps {
//   minHeight?: number;
//   maxHeight?: number;
//   className?: string;
//   containerClassName?: string;
//   title?: string;
//   rounded?: "default" | "full";
//   pressableClassName?: string;
//   style?: any;
//   inputStyle?: any;
//   onBlur?: () => void;
// }

// export const AutoExpandTextInput: React.FC<AutoExpandTextInputProps> = ({
//   value,
//   placeholder,
//   title,
//   onChangeText,
//   onContentSizeChange,
//   minHeight = 220,
//   maxHeight: propMaxHeight,
//   style,
//   inputStyle,
//   className,
//   containerClassName,
//   pressableClassName,
//   onBlur,
//   rounded = "default",
//   ...props
// }) => {
//   const { isIPhone16Pro } = useDeviceType();
//   const { height: windowHeight } = useWindowDimensions();
//   const [isFocused, setIsFocused] = useState(false);
//   const [height, setHeight] = useState<number>(minHeight);
//   const inputRef = useRef<TextInput>(null);

//   const maxHeight = propMaxHeight || windowHeight * 0.8;

//   const handleContentSizeChange = (e: any) => {
//     const newHeight = Math.max(minHeight, e.nativeEvent.contentSize.height);
//     setHeight(Math.min(newHeight, maxHeight));
//     onContentSizeChange?.(e);
//   };

//   // Reset height when value is cleared
//   useEffect(() => {
//     if (!value) {
//       setHeight(minHeight);
//     }
//   }, [value, minHeight]);

//   return (
//     <View
//       style={style}
//       className={cn("flex-col w-full gap-1", containerClassName)}
//     >
//       {title && (
//         <Text
//           className={cn(
//             isIPhone16Pro() ? "text-base" : "text-lg",
//             "text-primary-dark dark:text-primary-light font-medium opacity-80"
//           )}
//         >
//           {title}
//         </Text>
//       )}

//       <Pressable
//         className={cn(
//           "w-full",
//           "bg-inputGray-light dark:bg-inputGray-dark",
//           "border-2",
//           rounded === "default" ? "rounded-2xl" : "rounded-full",
//           "items-center flex-row",
//           pressableClassName,
//           isFocused
//             ? "border-primary-dark dark:border-primary-light"
//             : "border-borderGray-light dark:border-borderGray-dark"
//         )}
//       >
//         <TextInput
//           ref={inputRef}
//           multiline
//           scrollEnabled={height >= maxHeight}
//           value={value}
//           placeholder={placeholder}
//           placeholderTextColor="#7b7b7b"
//           onChangeText={onChangeText}
//           onFocus={() => setIsFocused(true)}
//           onBlur={() => {
//             setIsFocused(false);
//             onBlur?.();
//           }}
//           onContentSizeChange={handleContentSizeChange}
//           style={[
//             styles.input,
//             {
//               height: height,
//             },
//             inputStyle,
//           ]}
//           className={cn(
//             "text-primary-dark dark:text-primary-light border-none w-full",
//             isIPhone16Pro()
//               ? "p-2 pb-3 pt-2 text-base"
//               : "p-3 pb-4 pt-3 text-lg",
//             className
//           )}
//           {...props}
//         />
//       </Pressable>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   input: {
//     textAlignVertical: "top",
//   },
// });

export default InputField;
