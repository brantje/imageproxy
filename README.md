#Imageproxy
Small nodejs server for for proxing http images to https.
Cache is set to 10 days.

Usage:
```
https://imageproxy.local:8080/<encrypted-image-url>
```

To generate the encrypted image url you can use the following example code:
```php
class Crypto
{
    private $encryptKey = 'MySecretKey12345';
    private $iv = '1234567890123456';
    private $blocksize = 16;
    public function decrypt($data)
    {
        return $this->unpad(mcrypt_decrypt(MCRYPT_RIJNDAEL_128,
            $this->encryptKey,
            hex2bin($data),
            MCRYPT_MODE_CBC, $this->iv), $this->blocksize);
    }
    public function encrypt($data)
    {
        //don't use default php padding which is '\0'
        $pad = $this->blocksize - (strlen($data) % $this->blocksize);
        $data = $data . str_repeat(chr($pad), $pad);
        return bin2hex(mcrypt_encrypt(MCRYPT_RIJNDAEL_128,
            $this->encryptKey,
            $data, MCRYPT_MODE_CBC, $this->iv));
    }
    private function unpad($str, $blocksize)
    {
        $len = mb_strlen($str);
        $pad = ord( $str[$len - 1] );
        if ($pad && $pad < $blocksize) {
            $pm = preg_match('/' . chr($pad) . '{' . $pad . '}$/', $str);
            if( $pm ) {
                return mb_substr($str, 0, $len - $pad);
            }
        }
        return $str;
    }
}
$crypto = new Crypto();
$url = 'http://i.imgur.com/Ssiz30z.png';
$encrypted = $crypto->encrypt($url);
echo '<img src="https://imageproxy.local:8080/'. $encrypted .'">';
```
