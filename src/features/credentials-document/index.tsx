import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    justifyContent: 'center',
    textAlign: 'center',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paragraph: {
    fontSize: 12,
  },
  muted: {
    fontSize: 10,
    color: 'gray',
  },
});

export const CredentialsDocument = ({ npub, nsec }: { npub: string; nsec: string }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Nostr Platform Credentials</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>Secret Key:</Text>
          <Text style={styles.paragraph}>{nsec}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>Public Key:</Text>
          <Text style={styles.paragraph}>{npub}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.muted}>
            Please keep this credentials somewhere safe. We would recommend get one print-out to be
            stored in a safe place.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
