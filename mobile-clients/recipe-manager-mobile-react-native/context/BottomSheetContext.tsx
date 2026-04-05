import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useColorScheme } from "@/hooks/useColorScheme";
import Animated, {
  useAnimatedStyle,
  interpolate,
  useSharedValue,
} from "react-native-reanimated";

type BottomSheetContextType = {
  openBottomSheet: (content: React.ReactNode, snapPoints?: string[]) => void;
  closeBottomSheet: () => void;
};

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(
  undefined
);

export const BottomSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const colorScheme = useColorScheme();
  const [content, setContent] = useState<React.ReactNode>(null);
  const [currentSnapPoints, setCurrentSnapPoints] = useState<string[]>(["50%"]);
  const [isOpen, setIsOpen] = useState(false);

  const openBottomSheet = useCallback(
    (newContent: React.ReactNode, snapPoints?: string[]) => {
      setContent(newContent);
      if (snapPoints) {
        setCurrentSnapPoints(snapPoints);
      }
      setIsOpen(true);
      bottomSheetRef.current?.expand();
    },
    []
  );

  const closeBottomSheet = useCallback(() => {
    setIsOpen(false);
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.75}
      />
    ),
    []
  );

  return (
    <BottomSheetContext.Provider value={{ openBottomSheet, closeBottomSheet }}>
      {children}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={currentSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={(index) => {
          setIsOpen(index !== -1);
        }}
        backgroundStyle={{
          backgroundColor: colorScheme === "dark" ? "#1C1917" : "#F9F6F1",
        }}
        handleIndicatorStyle={{
          backgroundColor: colorScheme === "dark" ? "#F5F0EB90" : "#29211990",
        }}
      >
        <BottomSheetView className="flex-1">{content}</BottomSheetView>
      </BottomSheet>
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (context === undefined) {
    throw new Error("useBottomSheet must be used within a BottomSheetProvider");
  }
  return context;
};
