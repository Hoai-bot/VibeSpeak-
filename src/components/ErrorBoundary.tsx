import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("⚡ [SYSTEM ERROR BOUNDARY]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>⚠️ SYSTEM CRITICAL ERROR</Text>
          <Text style={styles.subtitle}>Ứng dụng gặp sự cố không xác định.</Text>
          
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {this.state.error?.toString() || "Unknown Error"}
            </Text>
          </View>

          <TouchableOpacity style={styles.btn} onPress={this.handleReset}>
            <Text style={styles.btnText}>🔄 KHỞI ĐỘNG LẠI HỆ THỐNG</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05020D', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: '#FF0055', fontSize: 20, fontWeight: '900', fontFamily: 'Courier New', marginBottom: 8 },
  subtitle: { color: '#AAAABB', fontSize: 13, fontFamily: 'Courier New', marginBottom: 20 },
  errorBox: { backgroundColor: '#110022', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#FF0055', width: '100%', marginBottom: 20 },
  errorText: { color: '#FFD700', fontSize: 11, fontFamily: 'Courier New' },
  btn: { backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: '#000', fontWeight: 'bold', fontFamily: 'Courier New', fontSize: 12 },
});

export default ErrorBoundary;