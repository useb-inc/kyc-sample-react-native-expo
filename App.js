import React, {Component} from "react";
import {Camera} from "expo-camera";
import {Text, StyleSheet, SafeAreaView} from "react-native";
import { WebView } from 'react-native-webview';

export default class SampleApp extends Component {
  constructor(props) {
    super(props);

    this.appWebview = null;
    this.domain = 'https://kyc.useb.co.kr/auth';

    this.state = {
      permissionsGranted: false,
      indexPage: { uri: this.domain + '?ver=1' },
    };

    this.handleCameraPermission();
  }

  handleCameraPermission = async () => {
    const {status} = await Camera.requestCameraPermissionsAsync();
    console.log(status);
    if (status === "granted") {
      this.setPermissionsGranted(true);
    }
  };

  setPermissionsGranted = value => {
    console.log('setPermissionsGranted', value);
    this.setState({ permissionsGranted: value });
  };

  doneProcessHandler = msgData => {
    if (msgData?.result) {
      const resultData = msgData.result;
      switch (resultData) {
        case 'success':
          console.log('success - KYC 작업이 성공했습니다.');
          break;
        case 'failed':
          console.log('failed - KYC 작업이 실패했습니다.');
          break;
        case 'complete':
          console.log('complete - KYC가 완료되었습니다.');
          break;
        case 'close':
          console.log('close - KYC가 완료되지 않았습니다.');
          break;
        default:
          console.log('알 수 없는 결과:', resultData);
          break;
      }
    }
  };

  /**
   * 화면에서 post를 던지면 react-native에서 받음(Throw a post on the screen, you will receive it from react-native)
   */
  onReceivedWebViewMessage = event => {
    const decodedMsg = decodeURIComponent(Base64.atob(event.nativeEvent.data));

    let msgData;
    try {
      msgData = JSON.parse(decodedMsg) || {};
      this.doneProcessHandler(msgData);
    } catch (error) {
      console.error(error);
      return;
    }
  };

  onWebViewLoadEnd = () => {
    console.log('onWebViewLoadEnd');
    const customer_id = '2'; // all
    let params = {
      customer_id: customer_id,
      id: 'demoUser',
      key: 'demoUser0000!',
    };

    let encodedParams = Base64.btoa(encodeURIComponent(JSON.stringify(params)));
    this.sendWebViewPostMessage(encodedParams);
  };

  /**
   * 화면에서 post를 던지면 react-native에서 받음(Throw a post on the screen, you will receive it from react-native)
   */
  sendWebViewPostMessage = message => {
    console.log('sendWebViewPostMessage', message);
    // console.log("sendWebViewPostMessage (decoded)", decodeURIComponent(Base64.atob(message)));
    this.appWebview.postMessage(message);
  };

  render() {
    return (
        <SafeAreaView style={styles.container}>
          {this.state.permissionsGranted && (
              <WebView
                  style={styles.webview}
                  source={this.state.indexPage}
                  originWhitelist={['*']}
                  ref={webview => (this.appWebview = webview)}
                  javaScriptEnabled={true}
                  useWebKit={true}
                  mediaPlaybackRequiresUserAction={false}
                  domStorageEnabled={true}
                  allowsInlineMediaPlayback={true}
                  startInLoadingState={true}
                  allowUniversalAccessFromFileURLs={true}
                  onMessage={this.onReceivedWebViewMessage}
                  onLoadEnd={this.onWebViewLoadEnd}
              />
          )}
          {!this.state.permissionsGranted && (
              <Text>
                카메라/갤러리 접근 권한이 없습니다. 권한 허용 후 이용해주세요. // no
                access authority for camera and gallery. check allowance of
                authortiy.
              </Text>
          )}
        </SafeAreaView>
    );
  }
}

// Base64 유틸리티 (동일하게 유지)
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const Base64 = {
  btoa: (input = '') => {
    let str = input;
    let output = '';

    for (
        let block = 0, charCode, i = 0, map = chars;
        str.charAt(i | 0) || ((map = '='), i % 1);
        output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
    ) {
      charCode = str.charCodeAt((i += 3 / 4));

      if (charCode > 0xff) {
        throw new Error(
            "'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.",
        );
      }

      block = (block << 8) | charCode;
    }

    return output;
  },

  atob: (input = '') => {
    let str = input.replace(/[=]+$/, '');
    let output = '';

    if (str.length % 4 == 1) {
      throw new Error(
          "'atob' failed: The string to be decoded is not correctly encoded.",
      );
    }
    for (
        let bc = 0, bs = 0, buffer, i = 0;
        (buffer = str.charAt(i++));
        ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
            ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
            : 0
    ) {
      buffer = chars.indexOf(buffer);
    }

    return output;
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});