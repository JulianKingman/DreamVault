import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { Text, YStack, XStack, Button } from 'tamagui';
import { Compass, Pencil, Check } from '@tamagui/lucide-icons';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '../contexts/ThemeContext';
import { setIntention } from '../utils/database';
import type { Intention } from '../types';

export interface IntentionBottomSheetRef {
  open: (dateKey: string, dateLabel: string, intention: Intention | undefined) => void;
}

export const IntentionBottomSheet = forwardRef<IntentionBottomSheetRef>(
  function IntentionBottomSheet(_, ref) {
    const { resolvedTheme } = useTheme();
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [dateLabel, setDateLabel] = useState('');
    const [content, setContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Use refs for values read in callbacks to avoid stale closures
    // (BottomSheetModal portals content and can hold stale callback refs)
    const dateKeyRef = useRef('');
    const contentRef = useRef('');
    const originalContentRef = useRef('');
    const hasIntentionRef = useRef(false);

    const snapPoints = useMemo(() => ['35%', '50%'], []);

    const handleContentChange = useCallback((text: string) => {
      setContent(text);
      contentRef.current = text;
    }, []);

    useImperativeHandle(ref, () => ({
      open(dk: string, dl: string, intention: Intention | undefined) {
        dateKeyRef.current = dk;
        const c = intention?.content ?? '';
        contentRef.current = c;
        originalContentRef.current = c;
        hasIntentionRef.current = !!intention;

        setDateLabel(dl);
        setContent(c);
        setIsEditing(!intention); // Go straight to edit if no intention yet
        bottomSheetRef.current?.present();
      },
    }));

    const handleDismiss = useCallback(() => {
      Keyboard.dismiss();
      setIsEditing(false);
    }, []);

    const handleEdit = useCallback(() => {
      setIsEditing(true);
      bottomSheetRef.current?.snapToIndex(1);
    }, []);

    const handleSave = useCallback(() => {
      setIntention(dateKeyRef.current, contentRef.current);
      const trimmed = contentRef.current.trim();
      originalContentRef.current = trimmed;
      hasIntentionRef.current = !!trimmed;
      setContent(trimmed);
      contentRef.current = trimmed;
      setIsEditing(false);
      Keyboard.dismiss();
      bottomSheetRef.current?.snapToIndex(0);
    }, []);

    const handleCancel = useCallback(() => {
      setContent(originalContentRef.current);
      contentRef.current = originalContentRef.current;
      setIsEditing(false);
      Keyboard.dismiss();
      if (!hasIntentionRef.current && !originalContentRef.current) {
        bottomSheetRef.current?.dismiss();
      } else {
        bottomSheetRef.current?.snapToIndex(0);
      }
    }, []);

    const isDark = resolvedTheme !== 'light';
    const bgColor = isDark
      ? resolvedTheme === 'midnight'
        ? 'hsl(0, 20%, 8%)'
        : '#0a1a33'
      : '#f8eeeb';
    const textColor = isDark
      ? resolvedTheme === 'midnight'
        ? 'hsl(0, 50%, 40%)'
        : '#dae6ff'
      : '#2a1f1b';
    const mutedColor = isDark
      ? resolvedTheme === 'midnight'
        ? 'hsl(0, 30%, 30%)'
        : '#6b7d99'
      : '#8a7a74';
    const inputBg = isDark
      ? resolvedTheme === 'midnight'
        ? 'hsl(0, 20%, 12%)'
        : '#0f2440'
      : '#f0e4df';
    const handleColor = isDark
      ? resolvedTheme === 'midnight'
        ? 'hsl(0, 30%, 25%)'
        : '#1e3a5f'
      : '#c4a99e';

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: bgColor }}
        handleIndicatorStyle={{ backgroundColor: handleColor }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        onDismiss={handleDismiss}
      >
        <BottomSheetView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}>
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
            <XStack alignItems="center" gap="$2">
              <Compass size={16} color={mutedColor} />
              <Text
                fontSize="$1"
                color={mutedColor}
                fontFamily="$body"
                fontWeight="600"
                letterSpacing={1.5}
                textTransform="uppercase"
              >
                Intention
              </Text>
            </XStack>

            {isEditing ? (
              <XStack gap="$2">
                <Button
                  size="$2"
                  chromeless
                  onPress={handleCancel}
                >
                  <Text fontSize="$3" color={mutedColor} fontFamily="$body">
                    Cancel
                  </Text>
                </Button>
                <Button
                  size="$2"
                  chromeless
                  onPress={handleSave}
                  icon={<Check size={16} color={textColor} />}
                >
                  <Text fontSize="$3" color={textColor} fontFamily="$body" fontWeight="600">
                    Save
                  </Text>
                </Button>
              </XStack>
            ) : (
              <Button
                size="$2"
                chromeless
                onPress={handleEdit}
                icon={<Pencil size={14} color={mutedColor} />}
              >
                <Text fontSize="$3" color={mutedColor} fontFamily="$body">
                  Edit
                </Text>
              </Button>
            )}
          </XStack>

          {/* Date label */}
          <Text
            fontSize="$2"
            color={mutedColor}
            fontFamily="$body"
            marginBottom="$3"
          >
            {dateLabel}
          </Text>

          {/* Content */}
          {isEditing ? (
            <BottomSheetTextInput
              value={content}
              onChangeText={handleContentChange}
              placeholder="What did you intend to dream about?"
              placeholderTextColor={mutedColor}
              multiline
              autoFocus
              style={{
                backgroundColor: inputBg,
                color: textColor,
                borderRadius: 16,
                padding: 16,
                fontSize: 16,
                fontStyle: 'italic',
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />
          ) : (
            <Text
              fontSize="$5"
              color={textColor}
              fontFamily="$heading"
              fontStyle="italic"
              lineHeight={28}
            >
              {content || 'No intention set'}
            </Text>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);
