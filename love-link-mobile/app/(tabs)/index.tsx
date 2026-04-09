import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View className="flex-1 bg-black justify-center px-6">
      <Text className="text-white text-3xl font-bold mb-8">
        Love Link 💜
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        className="bg-zinc-900 p-4 rounded-xl mb-4"
        style={{ color: "white" }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-zinc-900 p-4 rounded-xl mb-4"
        style={{ color: "white" }}
      />

      <Pressable className="bg-purple-600 p-4 rounded-xl">
        <Text className="text-white text-center font-semibold">
          Login
        </Text>
      </Pressable>
    </View>
  );
}