// get img page urls from album intro page
import { ReqQueue } from '../../base/request/ReqQueue'
import { IntroHtmlParser } from './IntroHtmlParser'
import { ImgPageInfo } from '../../../../core/bean/ImgPageInfo'

export class ImgUrlListParser {
    private introUrl: string;
    private sumOfIntroPage: number;
    private introPageUrls: string[];

    constructor(introUrl, sumOfImgPage) {
        this.introUrl = introUrl;
        this.sumOfIntroPage = this._getSumOfIntroPage(sumOfImgPage);
        this.introPageUrls = this._getIntroPageUrls();
    }

    request(): Promise<Array<ImgPageInfo>> {
        return new Promise((resolve, reject) => {
            this._request(resolve, reject);
        });
    }

    _getSumOfIntroPage(sumOfImgPage): number {
        // 40 is the thumb sum per intro page when small thumb model
        if (sumOfImgPage < 40) {
            return 1;
        }
        let reminder = sumOfImgPage % 40;
        if (reminder > 1) {
            return (sumOfImgPage - reminder) / 40 + 1;
        } else {
            return sumOfImgPage / 40;
        }
    }

    _getIntroPageUrls(): string[] {
        let urls: string[] = [];
        for (let i = 0; i < this.sumOfIntroPage; i++) {
            urls.push(`${this.introUrl}?p=${i}`);
        }
        return urls;
    }

    _request(resolve, reject) {
        new ReqQueue(this.introPageUrls)
            .request()
            .then(map => {
                let result = this.introPageUrls.reduce((imgUrls, introUrl) => {
                    imgUrls = imgUrls.concat(new IntroHtmlParser(map.get(introUrl), introUrl).getImgUrls());
                    return imgUrls;
                }, <Array<ImgPageInfo>>[]);
                let index = 0;
                result.forEach(i => {
                    i.index = index++
                });
                if (result.length !== 0) {
                    resolve(result);
                } else {
                    reject(new Error('parsing img html failed. It may be in Large mode'))
                }
            }, err => {
                reject(err);
                // TODO: show tip for this error
            });
    }
}
