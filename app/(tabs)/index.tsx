import React from 'react';
import { SafeAreaView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { NoteList } from '../../components/NoteList';
import { SkyScene } from '../../components/SkyScene';

const SKY_HEIGHT = Dimensions.get('window').height * 0.45;

export default function HomeScreen() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const skyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value * 0.5 }],
  }));

  const skyHeader = (
    <Animated.View style={skyStyle}>
      <SkyScene height={SKY_HEIGHT} />
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NoteList
        searchForm
        searchPosition="bottom"
        headerComponent={skyHeader}
        onScroll={scrollHandler}
        animated
      />
    </SafeAreaView>
  );
}
