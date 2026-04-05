import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getCurrentUser() {
  const user = await AsyncStorage.getItem("user");
  const token = await AsyncStorage.getItem("token");

  return { user: user ? JSON.parse(user) : null, token };
}
