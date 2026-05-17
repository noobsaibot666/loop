import React from 'react';
import {useNavigate} from 'react-router-dom';
import InfoPage from '../components/InfoPage';
import {useI18n} from '../i18n';

const CommunityAccessPage: React.FC = () => {
  const {t} = useI18n();
  const navigate = useNavigate();

  return (
    <InfoPage
      eyebrow={t('home.community.pageEyebrow')}
      title={t('home.community.pageTitle')}
      intro={t('home.community.pageIntro')}
      items={[
        t('home.community.pageGood1'),
        t('home.community.pageGood2'),
        t('home.community.pageGood3'),
        t('home.community.pageGood4'),
      ]}
      actions={
        <button
          type="button"
          className="primary-button info-page-action-button"
          onClick={() => navigate('/?community=active')}
        >
          {t('home.community.pageCta')}
        </button>
      }
    />
  );
};

export default CommunityAccessPage;
